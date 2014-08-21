require 'rubygems'
require 'bundler/setup'

require 'rack-timeout'
use Rack::Timeout
Rack::Timeout.timeout = 10

require './application'
run Sinatra::Application
