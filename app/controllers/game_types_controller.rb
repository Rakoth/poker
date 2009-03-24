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
      params[:blind_value].delete_if {|level| level[:value].blank? }
      @game_type.blind_values.create params[:blind_value]
      flash[:notice] = t 'controllers.game_types.new_type_successfully_created'
      redirect_to
    else
      flash[:error] = t 'controllers.game_types.cant_create_new_game_type'
      render :action => :new
    end
  end

  def edit
    @game_type = GameType.find params[:id]
    @blind_value = @game_type.blind_values.all
  end

  def update
    @game_type = GameType.find params[:id]
    if @game_type.update_attributes(params[:game_type])
      flash[:notice] = t :successfully_updated
      redirect_to
    else
      flash[:error] = t 'controllers.game_types.failed_to_update_type'
      render :action => :edit
    end
  end
end
