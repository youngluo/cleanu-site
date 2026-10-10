import CFG from '../../config.js'
import { copy, locale } from '../../site.js'
;(function () {
  'use strict'

  var REL = CFG.release || {}
  var listEl = document.querySelector('[data-log]')
  var statusEl = document.querySelector('[data-log-status]')
  if (!listEl || !REL.owner || !REL.repo) return

  var api = 'https://api.github.com/repos/' + REL.owner + '/' + REL.repo + '/releases?per_page=30'
  var dateFmt = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' })

  function setStatus(text, isError) {
    if (!statusEl) return
    statusEl.textContent = text
    statusEl.dataset.state = isError ? 'error' : 'ok'
  }

  function fmtSize(bytes) {
    if (!bytes && bytes !== 0) return ''
    var mb = bytes / 1048576
    return mb >= 1024 ? (mb / 1024).toFixed(1) + ' GB' : Math.round(mb) + ' MB'
  }

  function el(tag, className, text) {
    var node = document.createElement(tag)
    if (className) node.className = className
    if (text !== undefined && text !== null) node.textContent = text
    return node
  }

  function renderRelease(release) {
    var item = el('li', 'log__item')

    var head = el('div', 'log__head')
    head.appendChild(el('h2', 'log__ver', release.tag_name || copy('log.untagged')))
    if (release.published_at) {
      head.appendChild(el('p', 'log__date', dateFmt.format(new Date(release.published_at))))
    }
    if (release.prerelease) head.appendChild(el('p', 'log__flag', copy('log.prerelease')))
    item.appendChild(head)

    if (release.name && release.name !== release.tag_name) {
      item.appendChild(el('p', 'log__name', release.name))
    }

    /* 发布说明按纯文本渲染：不解析 Markdown，也不把远端内容当 HTML 插入 */
    if (release.body && release.body.trim()) {
      item.appendChild(el('div', 'log__notes', release.body.trim()))
    }

    var assets = (release.assets || []).filter(function (a) {
      return a.browser_download_url
    })
    if (assets.length) {
      var ul = el('ul', 'log__assets')
      assets.forEach(function (asset) {
        var li = el('li')
        var link = el('a', null, asset.name || copy('log.download'))
        link.href = asset.browser_download_url
        li.appendChild(link)
        var size = fmtSize(asset.size)
        if (size) li.appendChild(el('span', 'log__size', size))
        ul.appendChild(li)
      })
      item.appendChild(ul)
    }

    return item
  }

  function renderList(releases) {
    listEl.textContent = ''
    releases.forEach(function (release) {
      if (release.draft) return
      listEl.appendChild(renderRelease(release))
    })
    return listEl.children.length
  }

  var cacheKey = 'cleanu:releases:' + REL.owner + '/' + REL.repo
  var cached = null
  try {
    cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
  } catch (e) {
    cached = null
  }

  if (Array.isArray(cached)) {
    setStatus(renderList(cached) ? '' : copy('log.empty'), false)
  } else {
    var ctrl = 'AbortController' in window ? new AbortController() : null
    var timer = ctrl
      ? setTimeout(function () {
          ctrl.abort()
        }, 8000)
      : null
    fetch(api, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl ? ctrl.signal : undefined,
    })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then(function (releases) {
        if (timer) clearTimeout(timer)
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(releases))
        } catch (e) {
          /* 配额或隐私模式 */
        }
        setStatus(renderList(releases) ? '' : copy('log.empty'), false)
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer)
        var code = err && err.message
        if (code === '404') {
          setStatus(copy('log.notFound'), true)
        } else if (code === '403') {
          setStatus(copy('log.rateLimit'), true)
        } else if (err && err.name === 'AbortError') {
          setStatus(copy('log.timeout'), true)
        } else {
          setStatus(copy('log.network'), true)
        }
      })
  }
})()
