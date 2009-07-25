class GameSynchronizersController < ApplicationController

	before_filter :find_game
	
	def wait_for_start
		respond_to do |format|
			format.js {
				add_players = @game.players.select{|p| !params[:players].to_a.include?(p.id.to_s)}
				remove_players = params[:players].select{|id| !@game.players.map(&:id).include?(id.to_i)}
				changes = {}
				changes[:players_to_add] = add_players.map{|p| p.build_synch_data :init} unless add_players.empty?
				changes[:players_ids_to_remove] = remove_players unless remove_players.empty?
				if @game.started?
					changes[:data_for_start] = @game.build_synch_data(:on_start, current_user.id)
				end
				unless changes.empty?
					render :json => changes
				else
					render :nothing => true #, :status => :no_content
				end
				#return
			}
		end
	end

	def distribution
		respond_to do |format|
			format.js {render :json => @game.build_synch_data(:on_distribution, current_user.id)}
		end
	end

	def stage
    respond_to do |format|
			# params[:current_status]
      format.js {render :json => @game.build_synch_data(:on_next_stage, current_user.id)}
    end
	end

	def really_pause
		status = @game.paused_by_away? ? :ok : :bad_request
		render :nothing => true, :status => status
	end

	protected

	def find_game
		@game = current_user.games.find params[:game_id]
	end
end
