// components/WriteupsList.vue
<script setup>
import { useData } from "vitepress";
import { ref, onMounted } from "vue";

// Définition de la prop avec une valeur par défaut
const props = defineProps({
  folder: {
    type: String,
    default: 'writeups'
  }
});

const articles = ref([]);
let location = "";
let content = ""; 
onMounted(async () => {
  switch(props.folder){
    case "writeups":
      content = import.meta.glob("/writeups/**/*.md");
      break;
    case "cve":
      content = import.meta.glob("/cve/**/*.md");
      break;
    case "articles":
      content = import.meta.glob("/articles/**/*.md");
      break;
    default:
      content = import.meta.glob("/articles/**/*.md");
  }


  for (const path in content) {
    if (path.indexOf('index.md') < 0) {
    try {
      const module = await content[path]();
      articles.value.push({
        title: module?.__pageData?.frontmatter?.title || path.split("/").pop().replace(".md", ""),
        description: module?.__pageData?.frontmatter?.description || "",
        date: module?.__pageData?.frontmatter?.date || "",
        image: module?.__pageData?.frontmatter?.image || "/medias/writeups/default.jpg",
        path: path.replace(props.folder + "/", "").replace(".md", "")
      });
    } catch (error) {
      console.error(`Erreur lors du chargement de ${path}:`, error);
    }
  }
  }

  articles.value.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date) - new Date(a.date);
  });
});
</script>

<template>
  <div class="writeups-list">
    <div v-if="articles.length === 0" class="no-articles">
      Aucun article trouvé dans le dossier {{ props.folder }}
    </div>
  
    <div v-else v-for="article in articles" :key="article.path" class="article-item">
      <div class="article-content">
        <div class="article-text">
          <h3 class="article-title">
            <a :href="'/'+props.folder+ article.path">{{ article.title }}</a>
          </h3>
          <p v-if="article.description" class="article-description">
            {{ article.description }}
          </p>
          <span v-if="article.date" class="date">
            {{ new Date(article.date).toLocaleDateString() }}
          </span>
        </div>
        <div class="article-image" v-if="article.image">
          <img :src="article.image" :alt="article.title">
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .writeups-list {
    margin: 2rem 0;
  }

  .article-item {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--vp-c-divider);
  }

  .article-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .article-content {
    display: flex;
    gap: 2rem;
    align-items: start;
  }

  .article-text {
    flex: 1;
    min-width: 0;
    /* Empêche le débordement du texte */
  }

  .article-title {
    margin: 0 0 1rem;
    font-size: 1.5rem;
  }

  .article-title a {
    color: var(--vp-c-brand);
    text-decoration: none;
  }

  .article-title a:hover {
    color: var(--vp-c-brand-dark);
  }

  .article-description {
    margin: 0.5rem 0;
    line-height: 1.6;
    color: var(--vp-c-text-1);
  }

  .article-image {
    flex-shrink: 0;
    width: 200px;
    height: 150px;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .article-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .date {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.9em;
    color: var(--vp-c-text-2);
  }

  .no-articles {
    padding: 1rem;
    text-align: center;
    color: var(--vp-c-text-2);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .article-content {
      flex-direction: column;
    }

    .article-image {
      width: 100%;
      height: 200px;
      margin-top: 1rem;
    }
  }
</style>