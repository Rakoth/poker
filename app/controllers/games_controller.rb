class GamesController < ApplicationController

  before_filter :check_authorization, :except => :index

  def index
    @games = Game.find :all, :include => [:kind]
  end

  def show
    @game = Game.find params[:id], :include => [:kind]
  end

  def new
    @game = Game.new
    @kinds = GameType.for_create
  end

  def create
    if @kind = GameType.find_by_id(params[:game][:kind]) and @current_user.can_create?(@kind)
      if @game = Game.create( :kind => @kind, :blind_size => @kind.start_blind )
        if @game.add_player(@current_user)
          flash[:notice] = "Игра создана!"
          redirect_to game_url(@game)
        else
          flash[:notice] = "Игра создана, но подключиться к ней не удалось."
          redirect_to games_url
        end
      else
        flash[:error] = "При создании игры возникла ошибка!"
        redirect_to games_url
      end
    else
      flash[:error] = "Вы не можете создать игру такого типа!"
      @game = Game.new
      @kinds = GameType.for_create
      render :action => :new
    end
  end

end
