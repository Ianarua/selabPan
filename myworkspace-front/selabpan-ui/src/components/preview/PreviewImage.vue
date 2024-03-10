<template>
    <div class="image-viewer"></div>
    <el-image-viewer
        :initial-index="previewImgIndex"
        hide-on-click-modal
        :url-list="imageList"
        @close="closeImgViewer"
        v-if="previewImgIndex !== null"
    />
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue';

const {proxy} = getCurrentInstance();

const props = defineProps({
    imageList: {
        type: Array
    }
});

const previewImgIndex = ref(null);
const show = (index) => {
    previewImgIndex.value = index;
};

const closeImgViewer = () => {
    previewImgIndex.value = null;
};


defineExpose({show});
</script>

<style lang="scss" scoped>
.image-viewer {
    .el-image-viewer__mask {
        opacity: 0.7;
    }
}
</style>
