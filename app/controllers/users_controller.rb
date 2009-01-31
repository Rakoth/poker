class UsersController < ApplicationController
  
  def index
    @users = User.find :all
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
    if @user.save
      @user.create_info params[:info]
      flash[:notice] = "Регистрация прошла успешно"
      redirect_to login_url
    else
      @user.password = nil
      flash[:error] = "Ошибка при регистрации!"
      render :action => :new
    end
  end
  
end
