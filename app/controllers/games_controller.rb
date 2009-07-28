class GamesController < ApplicationController

  before_filter :check_authorization, :except => :index

  def index
    @games = Game.waited
  end

  def show
    @game = Game.find params[:id], :include => :type
		if @game and @game.users.include?(current_user)
			if @game.waited?
				@game_data = SyncBuilder::Game::Init.new(@game, :for_user => current_user)
			else
				@game_data = SyncBuilder::Game::InitAfterStart.new(@game, :for_user => current_user)
			end
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
					render :json => @game.id and return
        end
      end
    end
		render :nothing => true, :status => :bad_request
  end

end
