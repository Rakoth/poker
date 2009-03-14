# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base

  helper :all # include all helpers, all the time

  # See ActionController::RequestForgeryProtection for details
  # Uncomment the :secret if you're not using the cookie session store
  protect_from_forgery :secret => '8bef2a684c066408714d2a1e3a769645'
  
  before_filter :find_user, :set_locate

  protected

  def find_user
    @current_user = User.find_by_id session[:user_id] if session[:user_id]
  end

  def set_locate
    I18n.locale = (@current_user.locate if @current_user) or params[:locale] or I18n.default_locale
  end

  def check_authorization
    unless @current_user
      flash[:error] = "Необходимо авторизоваться для выполнения данного действия!"
      redirect_to games_url
    end
  end

end
