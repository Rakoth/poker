class GamesController < ApplicationController

  before_filter :check_authorization, :except => :index

  def index
    @games = Game.all :include => [:type]
  end

  def show
    @game = Game.find params[:id], :include => [:type]
    render :layout => false
  end

  def new
    @game = Game.new
    @types = GameType.for_create
  end

  def create
    if @type = GameType.find_by_id(params[:game][:type]) and @current_user.can_create?(@type)
      if @game = Game.create(:type => @type, :blind_size => @type.start_blind)
        if @current_user.join!(@game)
          flash[:notice] = t 'controllers.games.game_successfully_created'
          redirect_to game_url(@game)
        else
          flash[:notice] = t 'controllers.games.game_created_with_error'
          redirect_to games_url
        end
      else
        flash[:error] = t 'controllers.games.failed_to_create_game'
        redirect_to games_url
      end
    else
      flash[:error] = t 'controllers.games.access_denied_to_game_creation'
      @game = Game.new
      @types = GameType.for_create
      render :action => :new
    end
  end

end
