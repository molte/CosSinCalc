require 'rubygems'
require 'sinatra'
require 'lib/no_www'

set :app_file, __FILE__

get '/' do
  erb :calculator
end

get '/triangle/?' do
  redirect '/', 301
end

get '/about' do
  erb :about
end

get '/download' do
  erb :download
end

get '/downloads/:file' do
  redirect "https://s3-eu-west-1.amazonaws.com/cossincalc/offline/#{params[:file]}"
end

get '/feedback' do
  erb :feedback
end

not_found do
  erb :'errors/not_found'
end

error do
  erb :'errors/unkown'
end

configure :production do
  use NoWWW
end

helpers do
  include Rack::Utils
  alias_method :h, :escape_html
  
  def spotlight(html)
    @header_spotlight = html
  end
  
  def navigation_item(text, url, attributes = {})
    attributes.merge!(:href => url)
    attributes[:class] = merge_html_class(attributes[:class], 'active') if current_page?(url)
    "<li><a#{html_attributes attributes}><span>#{text}</span></a></li>"
  end
  
  def html_attributes(attributes)
    attributes.map { |name, value| %{ #{name}="#{h value}"} }.join
  end
  
  def merge_html_class(*classes)
    classes.compact * ' '
  end
  
  def current_page?(url)
    request.path_info == url
  end
  
  def include_stylesheet(path, attributes = {})
    @html_head ||= ''
    attributes.merge!(:rel => 'stylesheet', :href => "/stylesheets/#{path}.css", :type => "text/css")
    @html_head << %{<link#{html_attributes attributes} />}
  end
  
  def include_javascript(*paths)
    @javascripts ||= ''
    @javascripts += paths.map { |p| ", '/scripts/#{p}.js'" }.join
  end
  
  def erb_partial(template)
    erb(:"_#{template}", :layout => false)
  end
  
  def append_footer(html)
    @page_footer ||= ''
    @page_footer << html
  end
  
  def page_meta(title, description)
    @page_title = "CosSinCalc &#183; #{title}"
    @meta_description = description
  end
end
