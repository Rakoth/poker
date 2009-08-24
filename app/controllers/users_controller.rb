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
    @user.build_info params[:info]
		@user.build_money_purse
		@user.build_chips_purse :balance => 10000
    if @user.save_with_captcha
      flash.now[:notice] = t 'controllers.users.successfully_sign_up'
      redirect_to games_url
    else
      @user.password = nil
      flash.now[:error] = t 'controllers.users.failed_sign_up'
      render :action => :new
    end
  end
end
