import CFG from '../../config.js'

;(function () {
  'use strict'

  var REL = CFG.release || {}
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ---------- 界面状态：标签 + 幻灯片 ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tabs] [role="tab"]'))
  var lastIndex = 0

  var thumb = document.querySelector('[data-tabs] .tabs__thumb')
  var tabsBox = tabs.length ? tabs[0].parentElement : null

  function layoutThumb(animate) {
    if (!thumb || !tabs.length) return
    var host = tabsBox.getBoundingClientRect()
    var first = tabs[0].getBoundingClientRect()
    thumb.style.width = first.width + 'px'
    thumb.style.left = first.left - host.left + 'px'
    if (!animate) thumb.style.transition = 'none'
    var active =
      tabs.filter(function (t) {
        return t.getAttribute('aria-selected') === 'true'
      })[0] || tabs[0]
    thumb.style.transform = 'translateX(' + (active.getBoundingClientRect().left - first.left) + 'px)'
    if (!animate) {
      void thumb.offsetWidth
      thumb.style.transition = ''
    }
  }

  function selectTab(tab, focus) {
    var idx = tabs.indexOf(tab)
    var panel = document.getElementById(tab.getAttribute('aria-controls'))
    tabs.forEach(function (item) {
      var on = item === tab
      item.setAttribute('aria-selected', on ? 'true' : 'false')
      item.tabIndex = on ? 0 : -1
      var other = document.getElementById(item.getAttribute('aria-controls'))
      if (other) other.classList.toggle('is-active', on)
    })
    lastIndex = idx
    if (panel) panFrame(panel, true)
    layoutThumb(true)
    if (focus) tab.focus()
  }

  /* 长图：先停在顶部，再慢慢平移下去把整段内容过一遍；鼠标移上去就暂停 */
  var PAN_MS = 3500

  function setPan(img, px) {
    img.style.transition = 'none'
    img.style.setProperty('--pan', px + 'px')
    void img.offsetHeight
    img.style.transition = ''
  }

  function stopPan(img) {
    if (img._panAnim) {
      img._panAnim.cancel()
      img._panAnim = null
    }
  }

  function panFrame(frame, animate) {
    var img = frame.querySelector('.shot')
    if (!img) return
    var over = Math.round(img.getBoundingClientRect().height - frame.clientHeight)
    var toBottom = frame.dataset.pan === 'bottom' && over > 0
    stopPan(img)
    if (!toBottom) {
      setPan(img, 0)
      return
    }
    if (!animate || reduceMotion) {
      setPan(img, over)
      return
    }
    setPan(img, 0)
    var anim = img.animate(
      [{ transform: 'translateY(0px)' }, { transform: 'translateY(-' + over + 'px)' }],
      { duration: PAN_MS, easing: 'cubic-bezier(0.42, 0, 0.58, 1)' } /* 两头慢，中段也不过快 */
    )
    img._panAnim = anim
    setPan(img, over) /* 动画期间由它接管视觉；取消后停在这个位置，不回弹 */
    anim.addEventListener('finish', function () {
      anim.cancel()
      if (img._panAnim === anim) img._panAnim = null
    })
  }

  /* 指针停在图上就暂停，移开继续 */
  document.querySelectorAll('.shot-frame').forEach(function (frame) {
    var img = frame.querySelector('.shot')
    if (!img) return
    frame.addEventListener('pointerenter', function () {
      if (img._panAnim) img._panAnim.pause()
    })
    frame.addEventListener('pointerleave', function () {
      if (img._panAnim && img._panAnim.playState === 'paused') img._panAnim.play()
    })
  })

  function panActive(animate) {
    if (!tabs.length) return
    var frame = document.getElementById(tabs[lastIndex].getAttribute('aria-controls'))
    if (frame) panFrame(frame, animate)
  }

  window.addEventListener('resize', function () {
    panActive(false)
    layoutThumb(false)
  })
  window.addEventListener('load', function () {
    layoutThumb(false)
    panActive(false)
    /* 页面加载完把其余几屏也取回来，切换时不留空白帧 */
    document.querySelectorAll('.shot').forEach(function (img) {
      if (img.closest('.shot-frame') && img.closest('.shot-frame').classList.contains('is-active')) return
      img.loading = 'eager'
      var warm = new Image()
      warm.src = img.currentSrc || img.src
      if (img.decode)
        img.decode().catch(function () {
          /* 解码失败就当没预热 */
        })
    })
  })

  if (tabs.length) {
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        selectTab(tab)
        arm()
      })
      tab.addEventListener('keydown', function (e) {
        var next = null
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length]
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length]
        else if (e.key === 'Home') next = tabs[0]
        else if (e.key === 'End') next = tabs[tabs.length - 1]
        if (!next) return
        e.preventDefault()
        selectTab(next, true)
        arm()
      })
    })
    selectTab(tabs[0])

    /* ---------- 自动播放：一屏至少停完整个平移，再多静置一段 ----------
       间隔由 PAN_MS 派生（PAN_MS + PAN_DWELL_MS），所以改平移时长不会把间隔甩到后面
       导致长图没滚完就切屏。暂停条件都是「有人在看这一屏」：鼠标停在预览区、键盘焦点
       落在标签或帧上、页面切到后台、区块滚出视口。手动切屏只重置计时，不停止播放。 */
    var PAN_DWELL_MS = 1700
    var AUTOPLAY_MS = PAN_MS + PAN_DWELL_MS
    var show = document.querySelector('[data-show]')
    var timer = null
    var hold = { pointer: false, focus: false, offscreen: false, hidden: document.hidden }

    function arm() {
      clearTimeout(timer)
      timer = null
      if (reduceMotion || hold.pointer || hold.focus || hold.offscreen || hold.hidden) return
      timer = setTimeout(function () {
        selectTab(tabs[(lastIndex + 1) % tabs.length])
        arm()
      }, AUTOPLAY_MS)
    }

    if (show) {
      show.addEventListener('pointerenter', function () {
        hold.pointer = true
        arm()
      })
      show.addEventListener('pointerleave', function () {
        hold.pointer = false
        arm()
      })
      show.addEventListener('focusin', function () {
        hold.focus = true
        arm()
      })
      show.addEventListener('focusout', function () {
        hold.focus = false
        arm()
      })
      document.addEventListener('visibilitychange', function () {
        hold.hidden = document.hidden
        arm()
      })
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(
          function (entries) {
            hold.offscreen = !entries[0].isIntersecting
            arm()
          },
          { threshold: 0.25 }
        ).observe(show)
      }
      arm()
    }
  }

  /* ---------- FAQ 手风琴 ---------- */
  var faqButtons = document.querySelectorAll('[data-faq] .faq__q')
  function closeFaq(btn) {
    btn.setAttribute('aria-expanded', 'false')
    var panel = document.getElementById(btn.getAttribute('aria-controls'))
    if (panel) {
      panel.dataset.open = 'false'
      panel.setAttribute('aria-hidden', 'true')
    }
  }
  faqButtons.forEach(closeFaq)
  faqButtons.forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'))
    if (!panel) return
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true'
      faqButtons.forEach(closeFaq)
      if (open) return
      btn.setAttribute('aria-expanded', 'true')
      panel.dataset.open = 'true'
      panel.setAttribute('aria-hidden', 'false')
    })
  })

  /* ---------- 下载：把按钮换成真实 DMG 直链 ---------- */
  var releasesUrl = 'https://github.com/' + REL.owner + '/' + REL.repo + '/releases'
  var assetLinks = document.querySelectorAll('[data-asset]')
  var downloadBtn = document.querySelector('[data-download]')
  var byArch = {}
  var detected = null

  assetLinks.forEach(function (link) {
    link.href = releasesUrl + '/latest'
  })
  if (downloadBtn) downloadBtn.href = releasesUrl + '/latest'

  /* 先看显卡型号（真实硬件，Rosetta 下也不骗人），再看客户端提示 */
  function detectArch() {
    try {
      var gl = document.createElement('canvas').getContext('webgl')
      var ext = gl && gl.getExtension('WEBGL_debug_renderer_info')
      var renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).toLowerCase() : ''
      if (/apple m\d|apple silicon/.test(renderer)) return 'arm64'
      if (/intel|amd/.test(renderer)) return 'x86_64'
    } catch (e) {
      /* 拿不到就当我不知道 */
    }
    return null
  }

  /* 认得出架构、且那个架构有直链时才合并成一个按钮，否则保持两个 */
  function applyDownload() {
    if (!downloadBtn) return
    var asset = detected ? byArch[detected] : null
    var resolved = !!(asset && asset.browser_download_url)
    downloadBtn.hidden = !resolved
    assetLinks.forEach(function (link) {
      link.hidden = resolved
    })
    if (!resolved) return
    downloadBtn.href = asset.browser_download_url
    downloadBtn.textContent = '下载 · ' + (detected === 'arm64' ? 'Apple Silicon' : 'Intel')
  }

  function classify(name) {
    var n = name.toLowerCase()
    if (/(arm[-_ ]?64|aarch64|apple[\s-]?silicon)/.test(n)) return 'arm64'
    if (/(x86[-_ ]?64|amd64|intel)/.test(n)) return 'x86_64'
    return 'universal'
  }

  function applyRelease(release) {
    ;(release.assets || []).forEach(function (asset) {
      if (!/\.dmg$/i.test(asset.name || '')) return
      var arch = classify(asset.name)
      if (arch === 'universal') {
        if (!byArch.arm64) byArch.arm64 = asset
        if (!byArch.x86_64) byArch.x86_64 = asset
      } else if (!byArch[arch]) {
        byArch[arch] = asset
      }
    })
    assetLinks.forEach(function (link) {
      var found = byArch[link.dataset.asset]
      if (found && found.browser_download_url) link.href = found.browser_download_url
    })
    applyDownload()
  }

  detected = detectArch()
  if (!detected && navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    navigator.userAgentData
      .getHighEntropyValues(['architecture'])
      .then(function (hints) {
        var arch =
          hints && hints.architecture === 'arm' ? 'arm64' : hints && hints.architecture === 'x86' ? 'x86_64' : null
        if (arch) {
          detected = arch
          applyDownload()
        }
      })
      .catch(function () {
        /* 识别不到就保留兜底链接 */
      })
  }

  if (REL.owner && REL.repo) {
    var cacheKey = 'cleanu:release:' + REL.owner + '/' + REL.repo
    var cached = null
    try {
      cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
    } catch (e) {
      cached = null
    }

    if (cached && cached.tag_name) {
      applyRelease(cached)
    } else {
      var ctrl = 'AbortController' in window ? new AbortController() : null
      var timer = ctrl
        ? setTimeout(function () {
            ctrl.abort()
          }, 7000)
        : null
      fetch('https://api.github.com/repos/' + REL.owner + '/' + REL.repo + '/releases/latest', {
        headers: { Accept: 'application/vnd.github+json' },
        signal: ctrl ? ctrl.signal : undefined,
      })
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status))
          return res.json()
        })
        .then(function (release) {
          if (timer) clearTimeout(timer)
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(release))
          } catch (e) {
            /* 配额或隐私模式 */
          }
          applyRelease(release)
        })
        .catch(function () {
          /* 读不到就保留指向 Releases 页的默认链接 */
          if (timer) clearTimeout(timer)
        })
    }
  }
})()
