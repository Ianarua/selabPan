<template>
    <div class="music">
        <div class="body-content">
            <div class="cover">
                <img src="@/assets/music_cover.png">
            </div>
            <div ref="playerRef" class="music-player"></div>
        </div>
    </div>
</template>

<script setup>
import APlayer from 'APlayer';
import 'APlayer/dist/Aplayer.min.css';
import musicIcon from '@/assets/music_icon.jpg';


import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue';

const {proxy} = getCurrentInstance();

const props = defineProps({
    url: {
        type: String
    },
    fileName: {
        type: String
    }
});

const playerRef = ref();
const player = ref();
onMounted(() => {
    player.value = new APlayer({
        container: playerRef.value,
        audio: {
            url: `/api/${ props.url }`,
            name: props.fileName,
            cover: musicIcon,
            artist: ''
        }
    });
});

onUnmounted(() => {
    player.value.destroy();
});
</script>

<style lang="scss" scoped>
.music {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;

    .body-content {
        text-align: center;
        width: 80%;

        .cover {
            margin: 0px auto;
            width: 200px;
            text-align: center;

            img {
                width: 100%;
            }
        }

        .music-player {
            margin-top: 20px;
        }
    }
}
</style>
