iex> case {1, 2, 3} do
# <- comment.iex.__identifier__
#  ^ comment.iex
#    ^ keyword
#          ^ number
#                   ^ keyword
...>   {4, 5, 6} ->
# <- comment.iex.__identifier__
#  ^ comment.iex
#       ^ number
#                ^ operator
...>     "This clause won't match"
# <- comment.iex.__identifier__
#  ^ comment.iex
#        ^ string
...>   {1, x, 3} ->
# <- comment.iex.__identifier__
#  ^ comment.iex
...>     "This clause will match and bind x to 2 in this clause"
...>   _ ->
# <- comment.iex.__identifier__
#  ^ comment.iex
...>     "This clause would match any value"
...> end
# <- comment.iex.__identifier__
#  ^ comment.iex
#    ^ keyword
"This clause will match and bind x to 2 in this clause"
# ^ string
