
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/my-tree-game/'  // 必须和你的 GitHub 仓库名完全一致
    : '/'
}

