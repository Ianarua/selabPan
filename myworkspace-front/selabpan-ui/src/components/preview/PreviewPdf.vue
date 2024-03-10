<template>
    <div class="pdf">
        <vue-pdf-embed
            ref="pdfRef"
            :source="url"
            class="vue-pdf-embed"
            width="850"
        />
    </div>
</template>

<script setup>
import VuePdfEmbed from 'vue-pdf-embed';
import { ref, onMounted } from 'vue';

const props = defineProps({
    url: {
        type: String
    }
});

const url = ref('');
onMounted(() => {
    url.value = '/api' + props.url;
});
</script>

<style lang="scss" scoped>
.pdf {
    width: 100%;
}
</style>
