<script setup lang="ts">
import DOMPurify from "dompurify";
import { marked, Renderer } from "marked";
import { computed } from "vue";

const { props } = defineProps<{ props: { text?: string } }>();

const renderer = new Renderer();
renderer.html = ({ text }: { text: string }) => {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const html = computed(() => {
  const raw = marked.parse(props.text ?? "", { renderer, async: false });
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "code", "pre", "a", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "hr",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
});
</script>

<template>
  <div class="markdown-content text-sm leading-relaxed text-zinc-700 dark:text-zinc-300" v-html="html"></div>
</template>

<style scoped>
.markdown-content :deep(h1) {
  font-size: 1.5em;
  font-weight: 700;
  margin: 0.67em 0;
  line-height: 1.2;
}
.markdown-content :deep(h2) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 0.75em 0;
  line-height: 1.3;
}
.markdown-content :deep(h3) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0.83em 0;
  line-height: 1.4;
}
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-size: 1em;
  font-weight: 600;
  margin: 1em 0;
  line-height: 1.4;
}
.markdown-content :deep(p) {
  margin: 0.5em 0;
}
.markdown-content :deep(strong) {
  font-weight: 600;
}
.markdown-content :deep(em) {
  font-style: italic;
}
.markdown-content :deep(code) {
  font-size: 0.875em;
  padding: 0.15em 0.4em;
  border-radius: 0.25rem;
  background: rgb(228 228 231 / 1);
}
.markdown-content :deep(pre) {
  overflow-x: auto;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: rgb(24 24 27 / 1);
  color: rgb(212 212 216 / 1);
  margin: 0.75em 0;
}
.markdown-content :deep(pre code) {
  padding: 0;
  background: transparent;
  border-radius: 0;
}
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}
.markdown-content :deep(ul) {
  list-style-type: disc;
}
.markdown-content :deep(ol) {
  list-style-type: decimal;
}
.markdown-content :deep(li) {
  margin: 0.25em 0;
}
.markdown-content :deep(a) {
  color: rgb(99 102 241 / 1);
  text-decoration: underline;
}
.markdown-content :deep(blockquote) {
  border-left: 3px solid rgb(212 212 216 / 0.4);
  padding-left: 0.75em;
  margin: 0.75em 0;
  color: rgb(161 161 170 / 1);
}
.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid rgb(228 228 231 / 1);
  margin: 1em 0;
}
.markdown-content :deep(table) {
  border-collapse: collapse;
  margin: 0.75em 0;
}
.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid rgb(228 228 231 / 1);
  padding: 0.4em 0.75em;
}
.markdown-content :deep(th) {
  font-weight: 600;
}
</style>
