# Original script written by Trevor at http://almosteffortless.com/2009/11/05/no-www-rack-middleware/

# Websites should have a canonical address. This address shouldn't begin with "www" because 
# it's unnecessary and wasteful. See http://no-www.org/ for details. This middleware catches 
# requests that begin with "www" and redirects them to the more reasonable non-www address.

class NoWWW
 
  WWW = /^www\./i
  
  def initialize(app)
    @app = app
  end
  
  def call(env)
    request = Rack::Request.new(env)
    
    if request.host =~ WWW
      [301, { 'Location' => request.url.sub(/www\./i, '') }, ['Redirecting...']]
    else
      @app.call(env)
    end
  end
  
end
