<template>
    <div>
        <div class="top">
            <div class="top-op">
                <div class="btn">
                    <el-upload
                        :show-file-list="false"
                        :multiple="true"
                        :http-request="addFile"
                        :accept="fileAccept"
                    >
                        <el-button type="primary">
                            <span class="iconfont icon-upload"></span>
                            上传
                        </el-button>
                    </el-upload>
                </div>
                <el-button
                    type="danger"
                    :disabled="selectFileIdList.length === 0"
                    @click="delFileBatch"
                >
                    <span class="iconfont icon-del"></span>
                    批量删除
                </el-button>
                <div class="search-panel">
                    <!-- 搜索文件 -->
                    <el-input
                        clearable
                        placeholder="请输入文件名搜索"
                        v-model="fileNameFuzzy"
                        @keyup.enter="search"
                    >
                        <template #suffix>
                            <i class="iconfont icon-search" @click="search"></i>
                        </template>
                    </el-input>
                </div>
                <div class="iconfont icon-refresh" @click="loadDataList"></div>
            </div>
        </div>
        <div class="file-list" v-if="tableData.list && tableData.list.length > 0">
            <Table
                ref="dataTableRef"
                :columns="columns"
                :dataSource="tableData"
                :fetch="loadDataList"
                :initFetch="false"
                :options="tableOptions"
                @rowSelected="rowSelected"
            >
                <template #fileName="{ index, row }">
                    <div
                        class="file-item"
                        @mouseenter="showOp(row)"
                        @mouseleave="cancelShowOp(row)"
                    >
                        <template v-if="(row.fileType === 3 || row.fileType === 1) && row.status === 2">
                            <Icon :cover="row.fileCover" :width="32"/>
                        </template>
                        <template v-else>
                            <Icon :fileType="row.fileType"/>
                        </template>
                        <span class="file-name" v-if="!row.showEdit" :title="row.fileName">
                            <span @click="preview(row)">{{ row.fileName }}</span>
                            <span v-if="row.status === 0" class="transfer-status">转码中</span>
                        </span>
                        <span v-if="row.status === 1" class="transfer-status transfer-fail">转码失败</span>
                        <div class="edit-panel" v-if="row.showEdit">
                            <el-input
                                v-model.trim="row.fileNameReal"
                                ref="editNameRef"
                                :maxLength="190"
                                @keyup.enter="saveNameEdit(index)"
                            >
                                <template #suffix>{{ row.fileSuffix }}</template>
                            </el-input>
                            <span
                                :class="['iconfont icon-right1', row.fileNameReal ? '' : 'not-allow']"
                                @click="saveNameEdit(index)"
                            />
                            <span
                                class="iconfont icon-error"
                                @click="cancelNameEdit(index)"
                            />
                        </div>
                        <span class="op">
                            <template v-if="row.showOp && row.fileId && row.status === 2">
                                <span class="iconfont icon-share1" @click="share(row)">分享</span>
                                <span
                                    class="iconfont icon-download"
                                    @click="download(row)"
                                >
                                    下载
                                </span>
                                <span class="iconfont icon-del" @click="delFile(row)">删除</span>
                                <span class="iconfont icon-edit" @click="editFileName(index)">重命名</span>
                            </template>
                        </span>
                    </div>
                </template>
                <template #fileSize="{index, row}">
                    <span v-if="row.fileSize">{{ proxy.Utils.size2Str(row.fileSize) }}</span>
                </template>
            </Table>
        </div>
        <div class="no-data" v-else>
            <div class="no-data-inner">
                <Icon iconName="no_data" :width="120" fit="fill"/>
                <div class="tips">当前目录为空, 上传你的第一个文件吧</div>
                <div class="op-list">
                    <el-upload
                        :show-file-list="false"
                        :with-credentials="true"
                        :multiple="true"
                        :http-request="addFile"
                        :accept="fileAccept"
                    >
                        <div class="op-item">
                            <Icon iconName="file" :width="60"/>
                            <div>上传文件</div>
                        </div>
                    </el-upload>
                </div>
            </div>
        </div>
        <!-- 预览 -->
        <Preview ref="previewRef"/>
        <!-- 分享 -->
        <ShareFile ref="shareRef"/>
    </div>
</template>

<script setup>
import CategoryInfo from '@/js/CategoryInfo.js';
import ShareFile from './ShareFile.vue';
import { ref, getCurrentInstance, nextTick, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

const {proxy} = getCurrentInstance();

const emit = defineEmits(['addFile']);
const addFile = (fileData) => {
    console.log('fileData', fileData);
    emit('addFile', {file: fileData.file, filePid: '0'});
};

// 添加文件回调
const reload = () => {
    showLoading.value = false;
    loadDataList();
};
defineExpose({
    reload
});

const api = {
    loadDataList: '/file/loadDataList',
    rename: '/file/rename',
    newFoloder: '/file/newFoloder',
    getFolderInfo: '/file/getFolderInfo',
    delFile: '/file/delFile',
    changeFileFolder: '/file/changeFileFolder',
    createDownloadUrl: '/file/createDownloadUrl',
    download: '/api/file/download'
};

const fileAccept = computed(() => {
    const categoryItem = CategoryInfo[category.value];
    return categoryItem ? categoryItem.accept : '*';
});

const columns = [
    {
        label: '文件名',
        prop: 'fileName',
        scopedSlots: 'fileName'
    },
    {
        label: '修改时间',
        prop: 'lastUpdateTime',
        width: 200
    },
    {
        label: '大小',
        prop: 'fileSize',
        scopedSlots: 'fileSize',
        width: 200
    }
];

// 搜索
const search = () => {
    showLoading.value = true;
    loadDataList();
};
const tableData = ref({});
const tableOptions = ref({
    extHeight: 50,              // 最多几个
    selectType: 'checkbox',     // 选择 多/单
    showIndex: false            // 是否显示序号
});

const fileNameFuzzy = ref();
const showLoading = ref(true);
const category = ref();
const loadDataList = async () => {
    let params = {
        pageNo: tableData.value.pageNo,
        pageSize: tableData.value.pageSize,
        fileNameFuzzy: fileNameFuzzy.value,
        filePid: '0',
        category: category.value
    };
    if (params.category !== 'all') {
        delete params.filePid;
    }
    let result = await proxy.Request({
        url: api.loadDataList,
        showLoading: showLoading.value,
        params: params
    });
    if (!result) {
        return;
    }
    tableData.value = result.data;
};

// 展示操作按钮
const showOp = (row) => {
    tableData.value.list.forEach((element) => {
        element.showOp = false;
    });
    row.showOp = true;
};

const cancelShowOp = (row) => {
    row.showOp = false;
};

// 编辑行
const editing = ref(false);
const editNameRef = ref();

// 重命名
const cancelNameEdit = (index) => {
    const fileData = tableData.value.list[index];
    if (fileData.fileId) {
        fileData.showEdit = false;
    } else {
        tableData.value.list.splice(index, 1);
    }
    editing.value = false;
};

const saveNameEdit = async (index) => {
    const {fileId, filePid, fileNameReal} = tableData.value.list[index];
    if (fileNameReal === '' || fileNameReal.indexOf('/') !== -1) {
        proxy.Message.warning('文件名不能为空且不能含有斜杠');
        return;
    }
    let url = api.rename;
    if (fileId === '') {
        url = api.newFoloder;
    }
    let result = await proxy.Request({
        url: url,
        params: {
            fileId: fileId,
            filePid: filePid,
            fileName: fileNameReal
        }
    });
    if (!result) {
        return;
    }
    tableData.value.list[index] = result.data;
    editing.value = false;
};

const editFileName = (index) => {
    if (tableData.value.list[0].fileId === '') {
        tableData.value.list.splice(0, 1);
        index = index - 1;
    }
    tableData.value.list.forEach((element) => {
        element.showEdit = false;
    });
    let currentData = tableData.value.list[index];
    currentData.showEdit = true;
    // 编辑文件名
    currentData.fileNameReal = currentData.fileName.substring(0, currentData.fileName.indexOf('.'));
    currentData.fileSuffix = currentData.fileName.substring(currentData.fileName.indexOf('.'));

    editing.value = true;
    nextTick(() => {
        editNameRef.value.focus();
    });
};

// 多选
const selectFileIdList = ref([]);
const rowSelected = (rows) => {
    selectFileIdList.value = [];
    rows.forEach((item) => {
        selectFileIdList.value.push(item.fileId);
    });
};
// 删除
const delFile = (row) => {
    proxy.Confirm(
        `你确定要删除【${ row.fileName }】吗? 删除的文件可在10天内通过回收站还原`,
        async () => {
            let result = await proxy.Request({
                url: api.delFile,
                params: {
                    fileIds: row.fileId
                }
            });
            if (!result) {
                return;
            }
            await loadDataList();
        }
    );
};

const delFileBatch = () => {
    if (selectFileIdList.value.length === 0) {
        return;
    }
    proxy.Confirm(
        `你确定要删除这些文件吗? 删除的文件可在10天内通过回收站还原`,
        async () => {
            let result = await proxy.Request({
                url: api.delFile,
                params: {
                    fileIds: selectFileIdList.value.join(',')
                }
            });
            if (!result) {
                return;
            }
            await loadDataList();
        }
    );
};

// 预览
const previewRef = ref();
const preview = (data) => {
    if (data.status === 0) {
        proxy.Message.warning('文件未完成转码, 无法预览');
        return;
    }
    if (data.status === 1) {
        proxy.Message.error('文件转码失败, 无法预览');
        return;
    }
    previewRef.value.showPreview(data, 0);
};

// 下载文件
const download = async (row) => {
    let result = await proxy.Request({
        url: api.createDownloadUrl + '/' + row.fileId
    });
    if (!result) {
        return;
    }
    window.location.href = api.download + '/' + result.data;
};

// 分享
const shareRef = ref();
const share = (row) => {
    shareRef.value.show(row);
};

// 路由信息
const route = useRoute();

const init = () => {
    loadDataList();

};

watch(
    () => route,
    (newVal, oldVal) => {
        category.value = newVal.params.category;
        init();
    },
    {immediate: true, deep: true}
);
</script>

<style lang="scss" scoped>
@import '@/assets/file.list.scss';
</style>
