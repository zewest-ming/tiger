const articles = window.MINGMING_ARTICLES || [];

const state = {
  topic: "全部",
  query: "",
  sort: "newest"
};

const articleGrid = document.querySelector("#articleGrid");
const topicList = document.querySelector("#topicList");
const articleCount = document.querySelector("#articleCount");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const dialog = document.querySelector("#articleDialog");
const closeDialog = document.querySelector("#closeDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogTopic = document.querySelector("#dialogTopic");
const dialogMeta = document.querySelector("#dialogMeta");
const dialogBody = document.querySelector("#dialogBody");
const dialogCover = document.querySelector("#dialogCover");

document.querySelector("#year").textContent = new Date().getFullYear();

function getTopics() {
  const counts = articles.reduce(
    (acc, article) => {
      acc[article.topic] = (acc[article.topic] || 0) + 1;
      acc["全部"] += 1;
      return acc;
    },
    { "全部": 0 }
  );

  return Object.entries(counts);
}

function renderTopics() {
  topicList.innerHTML = getTopics()
    .map(([topic, count]) => {
      const active = topic === state.topic ? "is-active" : "";
      return `<button class="${active}" type="button" data-topic="${topic}">
        <span>${topic}</span>
        <strong>${count}</strong>
      </button>`;
    })
    .join("");
}

function getFilteredArticles() {
  const query = state.query.trim().toLowerCase();

  return articles
    .filter((article) => {
      const matchesTopic = state.topic === "全部" || article.topic === state.topic;
      const text = `${article.title} ${article.excerpt} ${article.tags.join(" ")}`.toLowerCase();
      return matchesTopic && (!query || text.includes(query));
    })
    .sort((a, b) => {
      if (state.sort === "popular") return b.views - a.views;
      if (state.sort === "oldest") return new Date(a.date) - new Date(b.date);
      return new Date(b.date) - new Date(a.date);
    });
}

function renderArticles() {
  const visibleArticles = getFilteredArticles();
  articleCount.textContent = `${visibleArticles.length} 篇`;

  if (!visibleArticles.length) {
    articleGrid.innerHTML = `<div class="empty-state">没有找到相关文章。</div>`;
    return;
  }

  articleGrid.innerHTML = visibleArticles
    .map((article) => {
      const title = escapeHtml(article.title);
      const tags = article.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
      const cover = article.cover
        ? `<img class="card-cover" src="${escapeHtml(article.cover)}" alt="${title}" loading="lazy" />`
        : "";
      return `<article class="article-card">
        ${cover}
        <div class="card-topline">
          <span>${escapeHtml(article.topic)}</span>
          <time datetime="${article.date}">${formatDate(article.date)}</time>
        </div>
        <h3>${title}</h3>
        <p>${inlineMarkdown(article.excerpt)}</p>
        <div class="tag-row">${tags}</div>
        <button type="button" data-article-id="${article.id}">阅读文章</button>
      </article>`;
    })
    .join("");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(date));
}

function markdownToHtml(markdown) {
  return markdown
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const text = block.trim();
      if (text.startsWith("### ")) return `<h3>${inlineMarkdown(text.slice(4))}</h3>`;
      if (text.startsWith("## ")) return `<h2>${inlineMarkdown(text.slice(3))}</h2>`;
      return `<p>${inlineMarkdown(text).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*\s*(.*?)\s*\*\*/g, "<strong>$1</strong>")
    .replace(/\s+([，。！？；：、])/g, "$1")
    .replace(/([“"《（])\s+/g, "$1")
    .replace(/\s+([”"》）])/g, "$1");
}

function openArticle(articleId) {
  const article = articles.find((item) => item.id === articleId);
  if (!article) return;

  dialogTitle.textContent = article.title;
  dialogTopic.textContent = article.topic;
  dialogMeta.textContent = `${formatDate(article.date)} · ${article.readTime} · ${article.views.toLocaleString("zh-CN")} 次阅读`;
  if (article.cover) {
    dialogCover.src = article.cover;
    dialogCover.alt = article.title;
    dialogCover.hidden = false;
  } else {
    dialogCover.hidden = true;
    dialogCover.removeAttribute("src");
  }
  dialogBody.innerHTML = markdownToHtml(article.body);
  dialog.showModal();
}

topicList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-topic]");
  if (!button) return;
  state.topic = button.dataset.topic;
  renderTopics();
  renderArticles();
});

articleGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-article-id]");
  if (!button) return;
  openArticle(button.dataset.articleId);
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderArticles();
});

sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderArticles();
});

closeDialog.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

renderTopics();
renderArticles();

// ====== 小老虎萌趣交互组件 ======
(function() {
  // 1. 右下角小老虎悬浮 Widget
  const tigerWidget = document.createElement("div");
  tigerWidget.className = "tiger-widget";
  tigerWidget.innerHTML = "🐯";
  tigerWidget.title = "回到顶部";
  document.body.appendChild(tigerWidget);

  tigerWidget.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 2. 点击页面随机脚印/气泡特效
  const icons = ["🐾", "🐯", "✨", "🌱"];
  document.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON" || e.target.tagName === "A") return;
    const spark = document.createElement("span");
    spark.innerText = icons[Math.floor(Math.random() * icons.length)];
    spark.style.position = "fixed";
    spark.style.left = (e.clientX - 10) + "px";
    spark.style.top = (e.clientY - 10) + "px";
    spark.style.fontSize = "20px";
    spark.style.pointerEvents = "none";
    spark.style.zIndex = "9999";
    spark.style.transition = "all 0.8s ease-out";
    document.body.appendChild(spark);
    requestAnimationFrame(() => {
      spark.style.transform = "translateY(-30px) scale(1.3)";
      spark.style.opacity = "0";
    });
    setTimeout(() => spark.remove(), 800);
  });
})();

