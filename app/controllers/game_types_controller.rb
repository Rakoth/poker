class GameTypesController < ApplicationController

  before_filter :check_authorization, :except => :index
  
  def index
    @game_types = GameType.all
  end

  def show
    @game_type = GameType.find params[:id]
  end

  def new
    @game_type = GameType.new
    @blind_value = BlindValue.new
  end

  def create
    @game_type = GameType.new params[:game_type]
    if @game_type.save
      params[:blind_value] = params[:blind_value].delete_if {|level| level[:value].empty? }
      @game_type.blind_values.create params[:blind_value]
      flash[:notice] = "Новый вид игры создан"
      redirect_to
    else
      flash[:error] = "Не удалось добавить новый тип игры"
      render :action => :new
    end
  end

  def edit
    @game_type = GameType.find params[:id]
  end

  def update
    @game_type = GameType.find params[:id]
    if @game_type.update_attributes(params[:game_type])
      flash[:notice] = "Изменения успешно внесены"
      redirect_to
    else
      flash[:error] = "Не удалось обновить тип игры"
      render :action => :edit
    end
  end
end
