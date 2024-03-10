<template>
    <div ref="docRef" class="doc-content"/>
</template>

<script setup>
import * as docx from 'docx-preview';
import { ref, getCurrentInstance, onMounted } from 'vue';

const {proxy} = getCurrentInstance();

const props = defineProps({
    url: {
        type: String
    }
});

const docRef = ref();

onMounted(async () => {
    let result = await proxy.Request({
        url: props.url,
        responseType: 'blob'
    });
    if (!result) {
        return;
    }
    await docx.renderAsync(result, docRef.value);
});
</script>

<style lang="scss" scoped>
.doc-content {
    margin: 0 auto;

    :deep(.docx-wrapper) {
        background: #fff;
        padding: 10px 0;
    }

    :deep .docx-wrapper > section.docx {
        margin-bottom: 0;
    }
}
</style>
