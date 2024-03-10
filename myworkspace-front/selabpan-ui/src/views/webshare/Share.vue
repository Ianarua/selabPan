<template>
    <div class="share">
        <div class="header">
            <div class="header-content">
                <div class="logo" @click="jump">
                    <span class="name">Selab云盘</span>
                </div>
            </div>
        </div>
    </div>
    <div class="share-body">
        <template v-if="Object.keys(shareInfo).length === 0">
            <div class="loading" v-loading="Object.keys(shareInfo).length === 0"></div>
        </template>
        <template v-else>
            <div class="share-panel">
                <div class="share-user-info">
                    <div class="avatar">
                        <Avatar
                            :userId="shareInfo.userId"
                            :avatar="shareInfo.avatar"
                            :width="50"
                        />
                    </div>
                    <div class="share-info">
                        <div class="user-info">
                            <span class="nick-name">{{ shareInfo.nickName }}</span>
                            <span class="share-time">分享于：{{ shareInfo.shareTime }}</span>
                        </div>
                        <div class="file-name">分享文件：{{ shareInfo.fileName }}</div>
                    </div>
                </div>
                <div class="share-op-btn">
                    <el-button
                        type="primary"
                        @click="cancelShare"
                        v-if="shareInfo.currentUser"
                    >
                        <span class="iconfont icon-cancel"></span>
                        取消分享
                    </el-button>
                    <el-button
                        v-else
                        type="primary"
                        @click="saveMyPan"
                        :disabled="selectIdList.length === 0"
                    >
                        <span class="iconfont icon-import"></span>
                        保存到我的网盘
                    </el-button>
                </div>
            </div>
            <div class="file-list">
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
                            <template
                                v-if="(row.fileType === 3 || row.fileType === 1) && row.status === 2"
                            >
                                <Icon :cover="row.fileCover" :width="32"/>
                            </template>
                            <template v-else>
                                <Icon
                                    :fileType="row.fileType"
                                />
                            </template>
                            <span class="file-name" :title="row.fileName">
                                <span @click="preview(row)">{{ row.fileName }}</span>
                            </span>
                            <span class="op">
                                <span
                                    class="iconfont icon-download"
                                    v-if="row.folderType === 0"
                                    @click="download(row)"
                                >
                                    下载
                                </span>
                                <span
                                    class="iconfont icon-import"
                                    @click="saveMyPanSingle(row)"
                                    v-if="row.showOp && !shareInfo.currentUser"
                                >
                                    保存到网盘
                                </span>
                            </span>
                        </div>
                    </template>
                    <template #fileSize="{ index, row }">
                        <span v-if="row.fileSize">{{ proxy.Utils.size2Str(row.fileSize) }}</span>
                    </template>
                </Table>
            </div>
        </template>
        <Preview ref="previewRef"/>
    </div>
</template>

<script setup>
import { ref, getCurrentInstance, watch } from 'vue';

const {proxy} = getCurrentInstance();
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const api = {
    getShareLoginInfo: '/showShare/getShareLoginInfo',
    loadFileList: '/showShare/loadFileList',
    createDownloadUrl: '/showShare/createDownloadUrl',
    download: '/api/showShare/download',
    cancelShare: '/share/cancelShare',
    saveShare: '/showShare/saveShare'
};

const shareId = route.params.shareId;
const shareInfo = ref({});
const getShareInfo = async () => {
    let result = await proxy.Request({
        url: api.getShareLoginInfo,
        showLoading: false,
        params: {
            shareId
        }
    });
    if (!result) {
        return;
    }
    if (result.data == null) {
        await router.push(`/shareCheck/${ shareId }`);
        return;
    }
    shareInfo.value = result.data;
};
getShareInfo();

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
const tableData = ref({});
const tableOptions = {
    extHeight: 80,
    selectType: 'checkbox'
};

const loadDataList = async () => {
    let params = {
        pageNo: tableData.value.pageNo,
        pageSize: tableData.value.pageSize,
        shareId: shareId
    };
    let result = await proxy.Request({
        url: api.loadFileList,
        params
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

const selectIdList = ref([]);
const rowSelected = (rows) => {
    selectIdList.value = [];
    rows.forEach((item) => {
        selectIdList.value.push(item.fileId);
    });
};

let category = ref('');

// 初始化
const init = () => {
    loadDataList();
};

watch(
    () => route,
    (newVal, oldVal) => {
        console.log(1);
        category.value = newVal.params.category;
        init();
    },
    {immediate: true, deep: true}
);

// 预览, 查看
const previewRef = ref();

const preview = (data) => {
    data.shareId = shareId;
    previewRef.value.showPreview(data, 2);
};

// 下载文件
const download = async (row) => {
    console.log(row);
    let result = await proxy.Request({
        url: api.createDownloadUrl + '/' + shareId + '/' + row.fileId
    });
    if (!result) {
        return;
    }
    window.location.href = api.download + '/' + result.data;
};

// 保存到我的网盘（多/单）
const saveMyPanFileIdArray = [];
const saveMyPan = () => {
    if (selectIdList.value.length === 0) {
        return;
    }
    if (!proxy.VueCookies.get('userInfo')) {
        // 在登录后回来
        router.push('/login?redirectUrl=' + route.path);
        return;
    }
    saveMyPanFileIdArray.value = selectIdList.value;
    // 保存
    saveMyPanDone();
};

// 页面中保存网盘（单）
const saveMyPanSingle = (row) => {
    if (!proxy.VueCookies.get('userInfo')) {
        router.push('/login?redirectUrl=' + route.path);
        return;
    }
    saveMyPanFileIdArray.value = [row.fileId];
    saveMyPanDone();
};

// 最后的保存网盘操作
const saveMyPanDone = async () => {
    let result = await proxy.Request({
        url: api.saveShare,
        params: {
            shareId: shareId,
            shareFileIds: saveMyPanFileIdArray.value.join(','),
            myFolderId: 0
        }
    });
    if (!result) {
        return;
    }
    await loadDataList();
    proxy.Message.success('保存成功');
};

// 取消分享
const cancelShare = () => {
    proxy.Confirm(`你确定要取消分享吗?`, async () => {
        let result = await proxy.Request({
            url: api.cancelShare,
            params: {
                shareIds: shareId
            }
        });
        if (!result) {
            return;
        }
        proxy.Message.success('取消分享成功');
        await router.push('/');
    });
};

const jump = () => {
    router.push('/');
};
</script>

<style lang="scss" scoped>
@import '@/assets/file.list.scss';

.header {
    width: 100%;
    position: fixed;
    background: rgba(4, 140, 252, 0.63);
    height: 50px;

    .header-content {
        width: 70%;
        margin: 0 auto;
        color: #fff;
        line-height: 50px;

        .logo {
            display: flex;
            align-items: center;
            cursor: pointer;

            .icon-pan {
                font-size: 40px;
            }

            .name {
                font-weight: bold;
                margin-left: 5px;
                font-size: 25px;
                animation-name: glitched;
                animation-duration: calc(.9s * 3.5);
                animation-iteration-count: infinite;
                animation-timing-function: linear;
            }

            @keyframes glitched {
                0% {
                    left: -4px;
                    transform: skew(-20deg);
                }
                11% {
                    left: 2px;
                    transform: skew(0deg);
                }
                50% {
                    transform: skew(0deg);
                }
                51% {
                    transform: skew(10deg);
                }
                60% {
                    transform: skew(0deg);
                }
                100% {
                    transform: skew(0deg);
                }
            }
        }
    }
}

.share-body {
    width: 70%;
    margin: 0px auto;
    padding-top: 50px;

    .loading {
        height: calc(100vh / 2);
        width: 100%;
    }

    .share-panel {
        margin-top: 20px;
        display: flex;
        justify-content: space-around;
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;

        .share-user-info {
            flex: 1;
            display: flex;
            align-items: center;

            .avatar {
                margin-right: 5px;
            }

            .share-info {
                .user-info {
                    display: flex;
                    align-items: center;

                    .nick-name {
                        font-size: 15px;
                    }

                    .share-time {
                        margin-left: 20px;
                        font-size: 12px;
                    }
                }

                .file-name {
                    margin-top: 10px;
                    font-size: 12px;
                }
            }
        }
    }
}

.file-list {
    margin-top: 10px;

    .file-item {
        .op {
            width: 170px;
        }
    }
}
</style>
