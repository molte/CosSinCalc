require 'rubygems'
require 'bundler/setup'

require 'rack-timeout'
use Rack::Timeout

require './application'
run Sinatra::Application
