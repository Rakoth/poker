class GamesController < ApplicationController
  before_filter :check_authorization, :except => :index

  def index
    @games = Game.waited
  end

	def started
		@games = Game.started
		render :action => :index
	end

	def finished
		@games = Game.finished
		render :action => :index
	end

  def show
    @game = Game.find params[:id], :include => [:type]
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

	def info
		@game = Game.find params[:id]
	end

  def create
    if @type = GameTypes::Base.find_by_id(params[:type_id]) and @type.may_be_created_by? current_user
      if @game = Game.create(:type => @type, :blind_size => @type.start_blind)
        current_user.join!(@game)
				render :json => @game.id and return
      end
    end
		render :nothing => true, :status => :forbidden
  end
end
