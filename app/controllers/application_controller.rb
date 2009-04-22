# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  helper :all
  helper_method :current_user_session, :current_user
  filter_parameter_logging :password, :password_confirmation

  # See ActionController::RequestForgeryProtection for details
  # Uncomment the :secret if you're not using the cookie session store
  # protect_from_forgery :secret => '8bef2a684c066408714d2a1e3a769645'
  protect_from_forgery :only => [:update, :delete, :create] #, :secret => '8bef2a684c066408714d2a1e3a769645'
  
  before_filter :set_locate
	#  before_filter :find_user, :set_locate

  protected


	def current_user_session
		@current_user_session ||= UserSession.find
	end

	def current_user
		@current_user ||= current_user_session && current_user_session.user
	end

	#  def find_user
	#    @current_user = User.find_by_id session[:user_id] if session[:user_id]
	#  end

  def set_locate
    I18n.locale = (@current_user.locate if @current_user) or params[:locale] or I18n.default_locale
  end

	def check_authorization
		unless current_user
			store_location
			flash[:error] = t 'controllers.application.authorisation_required'
			redirect_to new_user_session_url
			return false
		end
	end

	def store_location
		session[:return_to] = request.request_uri
	end

	def redirect_back_or_default(default)
		redirect_to(session[:return_to] || default)
		session[:return_to] = nil
	end

#	def turn_off_logging
#		logger.close
#	end


end
