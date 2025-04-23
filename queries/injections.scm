; Phoenix HTML template
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#any-of? @_sigil_name "H" "LVN")
 (#set! injection.language "heex")
 (#set! injection.combined))

; SQL injection
((sigil
  (sigil_name) @_sigil_name
  (quoted_content) @injection.content)
 (#eq? @_sigil_name "SQL")
 (#set! injection.language "sql")
 (#set! injection.combined))
