<template>
    <div class="uploader-panel">
        <div class="uploader-title">
            <span>上传任务</span>
            <span class="tips">（仅展示本次上传任务）</span>
        </div>
        <div class="file-list">
            <div v-for="(item, index) in fileList" class="file-item">
                <div class="upload-panel">
                    <div class="file-name">
                        {{ item.fileName }}
                    </div>
                    <div class="progress">
                        <!-- 上传 -->
                        <el-progress
                            :percentage="item.uploadProgress"
                            v-if="
                                item.status === STATUS.uploading.value ||
                                item.status === STATUS.upload_seconds.value ||
                                item.status === STATUS.upload_finish.value
                            "
                        />
                    </div>
                    <div class="upload-status">
                        <!-- 图标 -->
                        <span
                            :class="['iconfont', 'icon-' + STATUS[item.status].icon]"
                            :style="{ color: STATUS[item.status].color }"
                        />
                        <!-- 状态描述 -->
                        <span class="status" :style="{ color: STATUS[item.status].color }">
                          {{ item.status === 'fail' ? item.errorMsg : STATUS[item.status].desc }}
                        </span>
                        <!-- 上传中 -->
                        <span
                            class="upload-info"
                            v-if="item.status === STATUS.uploading.value"
                        >
                            {{ proxy.Utils.size2Str(item.uploadSize) }} / {{ proxy.Utils.size2Str(item.totalSize) }}
                        </span>
                    </div>
                </div>
                <div class="op">
                    <!-- MD5 -->
                    <el-progress
                        type="circle"
                        :width="50"
                        :percentage="item.md5Progress"
                        v-if="item.status === STATUS.init.value"
                    />
                    <div class="op-btn">
                        <span v-if="item.status === STATUS.uploading.value">
                            <Icon
                                :width="28"
                                class="btn-item"
                                iconName="upload"
                                v-if="item.pause"
                                title="上传"
                                @click="startUpload(item.uid)"
                            />
                            <Icon
                                v-else
                                :width="28"
                                class="btn-item"
                                iconName="pause"
                                title="暂停"
                                @click="pauseUpload(item.uid)"
                            />
                        </span>
                        <Icon
                            :width="28"
                            class="del btn-item"
                            iconName="del"
                            title="删除"
                            v-if="
                              item.status !== STATUS.init.value &&
                              item.status !== STATUS.upload_finish.value &&
                              item.status !== STATUS.upload_seconds.value
                            "
                            @click="delUpload(item.uid, index)"
                        />
                        <Icon
                            :width="28"
                            class="clean btn-item"
                            iconName="clean"
                            title="清除"
                            v-if="
                              item.status === STATUS.upload_finish.value ||
                              item.status === STATUS.upload_seconds.value
                            "
                            @click="delUpload(item.uid, index)"
                        />
                    </div>
                </div>
            </div>
            <div v-if="fileList.length === 0">
                <NoData msg="暂无上传任务"/>
            </div>
        </div>
    </div>
</template>

<script setup>
import { getCurrentInstance, ref } from 'vue';
import SparkMD5 from 'spark-md5';

const {proxy} = getCurrentInstance();

const api = {
    upload: '/file/uploadFile'
};

const STATUS = {
    emptyfile: {
        value: 'emptyfile',
        desc: '文件为空',
        color: '#F75000',
        icon: 'close'
    },
    fail: {
        value: 'fail',
        desc: '上传失败',
        color: '#F75000',
        icon: 'close'
    },
    init: {
        value: 'init',
        desc: '解析中',
        color: '#e6a23c',
        icon: 'clock'
    },
    uploading: {
        value: 'uploading',
        desc: '上传中',
        color: '#409eff',
        icon: 'upload'
    },
    upload_finish: {
        value: 'upload_finish',
        desc: '上传完成',
        color: '#67c23a',
        icon: 'ok'
    },
    upload_seconds: {
        value: 'upload_seconds',
        desc: '秒传',
        color: '#67c23a',
        icon: 'ok'
    }
};
const chunkSize = 1024 * 1024 * 5;
const fileList = ref([]);
const delList = ref([]);

const addFile = async (file, filePid) => {
    const fileItem = {
        // 文件, 文件大小, 文件流, 文件名...
        file: file,
        // 文件UID
        uid: file.uid,
        // md5进度
        md5Progress: 0,
        // md5值
        md5: null,
        // 文件名
        fileName: file.name,
        // 上传状态
        status: STATUS.init.value,
        // 已上传大小
        uploadSize: 0,
        // 文件总大小
        totalSize: file.size,
        // 上传进度
        uploadProgress: 0,
        // 暂停
        pause: false,
        // 当前分片
        chunkIndex: 0,
        // 文件父级ID
        filePid: filePid,
        // 错误信息
        errorMsg: null
    };
    // 加入文件
    fileList.value.unshift(fileItem);
    if (fileItem.totalSize === 0) {
        fileItem.status = STATUS.emptyfile.value;
        return;
    }
    // 文件MD5
    let md5FileUid = await computeMd5(fileItem);
    if (md5FileUid === null) {
        return;
    }
    await uploadFile(md5FileUid);
};
defineExpose({addFile});

//开始上传
const startUpload = (uid) => {
    let currentFile = getFileByUid(uid);
    currentFile.pause = false;
    uploadFile(uid, currentFile.chunkIndex);
};
// 暂停上传
const pauseUpload = (uid) => {
    let currentFile = getFileByUid(uid);
    currentFile.pause = true;
};
//删除文件
const delUpload = (uid, index) => {
    delList.value.push(uid);
    fileList.value.splice(index, 1);
};

// 计算MD5
const computeMd5 = (fileItem) => {
    console.log(fileItem);
    let file = fileItem.file;
    let chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    let spark = new SparkMD5.ArrayBuffer();
    let fileReader = new FileReader();

    let loadNext = () => {
        let start = currentChunk * chunkSize;       // 当前分片开始位置
        let end = start + chunkSize >= file.size ? file.size : start + chunkSize;   // 当前分片结束位置
        fileReader.readAsArrayBuffer(file.slice(start, end));
    };
    loadNext();

    return new Promise((resolve, reject) => {
        let resultFile = getFileByUid(file.uid);    // 修改resultFile，就相当于修改了当前file
        fileReader.onload = (e) => {
            spark.append(e.target.result);
            currentChunk++;
            if (currentChunk < chunks) {
                console.log(currentChunk);
                resultFile.md5Progress = Math.floor((currentChunk / chunks) * 100);   // 更新MD5计算进度
                loadNext();
            } else {
                let md5 = spark.end(false);
                spark.destroy();
                resultFile.md5Progress = 100;   // 更新MD5计算进度为100%
                resultFile.status = STATUS.uploading.value; // 更新文件状态为上传中
                resultFile.md5 = md5;   // 存储计算得到的MD5值
                resolve(fileItem.uid);
            }
        };
        fileReader.onerror = () => {
            resultFile.md5Progress = -1;    // 更新MD5计算失败的状态
            resultFile.status = STATUS.fail.value;  // 更新文件状态为上传失败
            resolve(fileItem.uid);
        };
    }).catch((error) => {
        return null;
    });
};

// 获取文件，返回file对象
const getFileByUid = (uid) => {
    return fileList.value.find((item) => {
        return item.file.uid === uid;
    });
};

const emit = defineEmits(['uploadCallback']);
const uploadFile = async (uid, chunkIndex) => {
    chunkIndex = chunkIndex ? chunkIndex : 0;
    // 分片上传
    let currentFile = getFileByUid(uid);
    const file = currentFile.file;
    const fileSize = currentFile.totalSize;
    const chunks = Math.ceil(fileSize / chunkSize);
    for (let i = chunkIndex; i < chunks; i++) {
        let delIndex = delList.value.indexOf(uid);
        if (delIndex !== -1) {
            delList.value.splice(delIndex, 1);
            break;
        }
        currentFile = getFileByUid(uid);
        if (currentFile.pause) {
            break;
        }
        let start = i * chunkSize;
        let end = start + chunkSize >= fileSize ? fileSize : start + chunkSize;
        let chunkFile = file.slice(start, end);
        let updateResult = await proxy.Request({
            url: api.upload,
            showLoading: false,
            dataType: 'file',
            params: {
                file: chunkFile,
                fileName: file.name,
                fileMd5: currentFile.md5,
                chunkIndex: i,
                chunks: chunks,
                fileId: currentFile.fileId,
                filePid: currentFile.filePid
            },
            showError: false,
            errorCallback: (errorMsg) => {
                currentFile.status = STATUS.fail.value;
                currentFile.errorMsg = errorMsg;
            },
            uploadProgressCallback: (event) => {
                let loaded = event.loaded;
                if (loaded > fileSize) {
                    loaded = fileSize;
                }
                currentFile.uploadSize = i * chunkSize + loaded;
                currentFile.uploadProgress = Math.floor(
                    (currentFile.uploadSize / fileSize) * 100
                );
            }
        });
        if (updateResult == null) {
            break;
        }
        currentFile.fileId = updateResult.data.fileId;
        currentFile.status = STATUS[updateResult.data.status].value;
        currentFile.chunkIndex = i;
        if (
            updateResult.data.status === STATUS.upload_seconds.value ||
            updateResult.data.status === STATUS.upload_finish.value
        ) {
            currentFile.uploadProgress = 100;
            emit('uploadCallback');
            break;
        }
    }
};
</script>

<style lang="scss" scoped>
.uploader-panel {
    .uploader-title {
        border-bottom: 1px solid #ddd;
        line-height: 40px;
        padding: 0 10px;
        font-size: 15px;

        .tips {
            font-size: 13px;
            color: rgb(169, 169, 169);
        }
    }

    .file-list {
        overflow: auto;
        padding: 10px 0;
        min-height: calc(100vh / 2);
        max-height: calc(100vh - 120px);

        .file-item {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 3px 10px;
            background-color: #fff;
            border-bottom: 1px solid #ddd;
        }

        .file-item:nth-child(even) {
            background-color: #fcf8f4;
        }

        .upload-panel {
            flex: 1;

            .file-name {
                color: rgb(64, 62, 62);
            }

            .upload-status {
                display: flex;
                align-items: center;
                margin-top: 5px;

                .iconfont {
                    margin-right: 3px;
                }

                .status {
                    color: red;
                    font-size: 13px;
                }

                .upload-info {
                    margin-left: 5px;
                    font-size: 12px;
                    color: rgb(112, 111, 111);
                }
            }

            .progress {
                height: 10px;
            }
        }

        .op {
            width: 100px;
            display: flex;
            align-items: center;
            justify-content: flex-end;

            .op-btn {
                .btn-item {
                    cursor: pointer;
                }

                .del,
                .clean {
                    margin-left: 5px;
                }
            }
        }
    }
}
</style>
