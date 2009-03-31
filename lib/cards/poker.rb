module Poker
  BASEDIR = File.dirname(File.expand_path(__FILE__))
  $LOAD_PATH.unshift BASEDIR
  $LOAD_PATH.uniq!
end

require 'snippets'
require 'deck'
require 'card'
require 'hand'
require 'table'
require 'constants'
