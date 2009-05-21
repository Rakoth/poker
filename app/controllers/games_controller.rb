class GamesController < ApplicationController

  before_filter :check_authorization, :except => :index

  def index
    @games = Game.waited :include => [:type]
  end

  def show
    @game = Game.find params[:id], :include => [:type]
		if(@game and @game.users.include?(current_user))
			@game_in_json = @game.build_synch_data(:init, current_user.id).to_json
			render :layout => false
		else
			redirect_to games_url
		end
  end

  def new
    @game = Game.new
    @types = GameType.for_create
  end

  def create
    if @type = GameType.find_by_id(params[:type_id]) and current_user.can_create?(@type)
      if @game = Game.create(:type => @type, :blind_size => @type.start_blind)
        if current_user.join!(@game)
					render :json => @game.id
#          flash[:notice] = t 'controllers.games.game_successfully_created'
#          redirect_to game_url(@game)
        else
					render :nothing => true, :status => :bad_request
#          flash[:notice] = t 'controllers.games.game_created_with_error'
#          redirect_to games_url
        end
      else
				render :nothing => true, :status => :bad_request
#        flash[:error] = t 'controllers.games.failed_to_create_game'
#        redirect_to games_url
      end
    else
			render :nothing => true, :status => :bad_request
#      flash[:error] = t 'controllers.games.access_denied_to_game_creation'
#      @game = Game.new
#      @types = GameType.for_create
#      render :action => :new
    end
  end

end
