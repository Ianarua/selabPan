<template>
    <PreviewImage
        ref="imageViewRef"
        :imageList="[imageUrl]"
        v-if="fileInfo.fileType === 3"
    />
    <Window
        :show="windowShow"
        @close="closeWindow"
        :width="fileInfo.fileType === 1 ? 1500 : 900"
        :title="fileInfo.fileName"
        :align="fileInfo.fileType === 1 ? 'center' : 'top'"
        v-else
    >
        <PreviewVideo :url="url" v-if="fileInfo.fileType === 1"/>
        <PreviewMusic
            :url="url"
            :fileName="fileInfo.fileName"
            v-if="fileInfo.fileType === 2"
        />
        <PreviewPdf :url="url" v-if="fileInfo.fileType === 4"/>
        <PreviewDoc :url="url" v-if="fileInfo.fileType === 5"/>
        <PreviewExcel :url="url" v-if="fileInfo.fileType === 6"/>
        <PreviewTxt
            :url="url"
            v-if="fileInfo.fileType === 7 || fileInfo.fileType === 8"
        />
        <PreviewDownload
            :createDownloadUrl="createDownloadUrl"
            :downloadUrl="downloadUrl"
            :fileInfo="fileInfo"
            v-if="fileInfo.fileCategory === 5 && fileInfo.fileType !== 8"
        />
    </Window>
</template>

<script setup>
import PreviewImage from './PreviewImage.vue';
import PreviewVideo from '@/components/preview/PreviewVideo.vue';
import PreviewDoc from '@/components/preview/PreviewDoc.vue';
import PreviewExcel from '@/components/preview/PreviewExcel.vue';
import PreviewPdf from '@/components/preview/PreviewPdf.vue';
import PreviewTxt from '@/components/preview/PreviewTxt.vue';
import PreviewMusic from '@/components/preview/PreviewMusic.vue';
import PreviewDownload from '@/components/preview/PreviewDownload.vue';

import { ref, reactive, getCurrentInstance, computed, nextTick, onMounted } from 'vue';

const {proxy} = getCurrentInstance();
const imageUrl = computed(() => {
    return (
        proxy.globalInfo.imageUrl + fileInfo.value.fileCover.replaceAll('_.', '.')
    );
});

const windowShow = ref(false);
const closeWindow = () => {
    windowShow.value = false;
};

const FILE_URL_MAP = {
    0: {
        fileUrl: '/file/getFile',
        videoUrl: '/file/ts/getVideoInfo',
        createDownloadUrl: '/file/createDownloadUrl',
        downloadUrl: '/api/file/download'
    },
    1: {
        fileUrl: '/admin/getFile',
        videoUrl: '/admin/ts/getVideoInfo',
        createDownloadUrl: '/admin/createDownloadUrl',
        downloadUrl: '/api/admin/download'
    },
    2: {
        fileUrl: '/showShare/getFile',
        videoUrl: '/showShare/ts/getVideoInfo',
        createDownloadUrl: '/showShare/createDownloadUrl',
        downloadUrl: '/api/showShare/download'
    }
};

const url = ref(null);
const createDownloadUrl = ref(null);
const downloadUrl = ref(null);

const fileInfo = ref({});
const imageViewRef = ref();
const showPreview = (data, showPart) => {
    console.log(data, showPart);
    fileInfo.value = data;
    if (data.fileType === 3) {
        nextTick(() => {
            imageViewRef.value.show(0);
        });
    } else {
        windowShow.value = true;
        let _url = FILE_URL_MAP[showPart].fileUrl;
        let _createDownloadUrl = FILE_URL_MAP[showPart].createDownloadUrl;
        let _downloadUrl = FILE_URL_MAP[showPart].downloadUrl;

        if (data.fileType === 1) {
            _url = FILE_URL_MAP[showPart].videoUrl;
        }
        if (showPart === 0) {
            _url += '/' + data.fileId;
            _createDownloadUrl += '/' + data.fileId;
        } else if (showPart === 1) {
            _url += '/' + data.userId + '/' + data.fileId;
            _createDownloadUrl += '/' + data.userId + '/' + data.fileId;
        } else if (showPart === 2) {
            _url += '/' + data.shareId + '/' + data.fileId;
            _createDownloadUrl += '/' + data.shareId + '/' + data.fileId;
        }
        url.value = _url;
        createDownloadUrl.value = _createDownloadUrl;
        downloadUrl.value = _downloadUrl;
    }
};

defineExpose({showPreview});

/*
    fileCategory: 文件类别，用于区分不同类型的文件
        0: 普通文件
        1: 视频（视频）
        2: 音频（音乐）
        3: 图片（图片）
        4: 文档（PDF、txt、docx、excel）
        5: 其他、需要下载（zip、md不下、ppt）
    fileType: 文件类型，表示文件的具体类型，可能的取值取决于不同的文件类别
        0: 未定义的文件类型
        1: 视频文件（视频）
        2: 音乐文件（音乐）
        3: 图片文件（图片）
        4: PDF 文件（PDF）
        5: 文档文件（docx）
        6: Excel 文件（excel）
        7: 文本文件（txt）
        8: 其他文件类型（md）
        10: 需要下载文件（zip、ppt）
    fileId: 文件的唯一标识符
    fileName: 文件名
    fileCover: 文件封面图的 URL
    userId: 用户 ID
    shareId: 分享 ID
 */
</script>

<style lang="scss" scoped>
</style>
