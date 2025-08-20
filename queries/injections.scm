; Phoenix HTML template
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#any-of? @_sigil_name "H" "LVN" "HOLO")
 (#set! injection.language "heex")
 (#set! injection.combined))

; Regex
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#any-of? @_sigil_name "r" "R")
 (#set! injection.language "regex")
 (#set! injection.combined))

; Json
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#any-of? @_sigil_name "j" "J")
 (#set! injection.language "json")
 (#set! injection.combined))

; SQL injection
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#eq? @_sigil_name "SQL")
 (#set! injection.language "sql")
 (#set! injection.combined))

; Surface
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#eq? @_sigil_name "F")
 (#set! injection.language "surface")
 (#set! injection.combined))

; Markdown
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#eq? @_sigil_name "MD")
 (#set! injection.language "markdown")
 (#set! injection.combined))

; Zig
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#any-of? @_sigil_name "z" "Z")
 (#set! injection.language "zig")
 (#set! injection.combined))

; Python
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#eq? @_sigil_name "PY")
 (#set! injection.language "python")
 (#set! injection.combined))

; JavaScript
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#eq? @_sigil_name "JS")
 (#set! injection.language "javascript")
 (#set! injection.combined))

; Svelte
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#eq? @_sigil_name "V")
 (#set! injection.language "svelte")
 (#set! injection.combined))

; Vue
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#eq? @_sigil_name "VUE")
 (#set! injection.language "vue")
 (#set! injection.combined))
