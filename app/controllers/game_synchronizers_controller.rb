class GameSynchronizersController < ApplicationController

	before_filter :find_current_game
	
	def wait_for_start
		if @game.started?
			changes = SyncBuilder::Game::Start.new @game, :players => params[:players], :for_user => current_user
		else
			changes = SyncBuilder::Game::WaitForStart.new @game, :players => params[:players]
		end
		unless changes.empty?
			render :json => changes
		else
			render :nothing => true #, :status => :no_content
		end
	end

	def distribution
		render :json => SyncBuilder::Game::Distribution.new(@game, :for_user => current_user)
	end

	def stage
		render :json => SyncBuilder::Game::Stage.new(@game, :stage => params[:stage])
	end

	def really_paused
		status = @game.paused_by_away? ? :ok : :bad_request
		render :nothing => true, :status => status
	end
end
