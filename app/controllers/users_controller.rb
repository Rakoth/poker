class UsersController < ApplicationController

  before_filter :check_authorization, :only => [:index, :show]

  def index
    @users = User.all
  end

  def show
    @user = User.find params[:id]
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new params[:user]
    @user.login = params[:user][:login]
    @user.email = params[:user][:email]
    if @user.save_with_captcha
      @user.create_info params[:info]
      flash[:notice] = t 'controllers.users.successfully_sign_up'
      redirect_to games_url
    else
      @user.password = nil
      flash[:error] = t 'controllers.users.failed_sign_up'
      render :action => :new
    end
  end
  
end
