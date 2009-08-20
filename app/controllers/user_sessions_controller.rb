class UserSessionsController < ApplicationController
	before_filter :check_authorization, :only => :destroy

	def new
    @user_session = UserSession.new
  end

  def create
    @user_session = UserSession.new(params[:user_session])
    if @user_session.save
      flash[:notice] = t 'controllers.user_sessions.hello', :login => current_user.login
      redirect_to games_url
    else
      flash.now[:error] = t 'controllers.user_sessions.wrong_password'
      render :action => :new
    end
  end

  def destroy
    flash[:notice] = t 'controllers.user_sessions.bye', :login => current_user.login
		current_user_session.destroy
    redirect_to games_url
  end
end
