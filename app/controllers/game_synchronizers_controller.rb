class GameSynchronizersController < ApplicationController

	def wait_for_start
		respond_to do |format|
			format.json {
				game = Game.find params[:id]
				add_players = game.players.select{|p| !params[:players].to_a.include?(p.id.to_s)}
				remove_players = params[:players].select{|id| !game.players.map(&:id).include?(id.to_i)}
				changes = {}
				changes[:add] = add_players.map{|p| p.build_synch_data :init} unless add_players.empty?
				changes[:remove] = remove_players unless remove_players.empty?
				if game.started?
					changes[:game] = game.build_synch_data(:on_start).merge(:client_hand => current_user.current_player(game.id).hand.to_s)
				end
				unless changes.empty?
					render :json => changes
				else
					render :nothing => true, :status => :no_content
				end
				return
			}
		end
	end

	def distribution
		respond_to do |format|
			format.json {render :json => Game.find(params[:id]).build_synch_data(:on_distribution) and return}
		end
	end

	def stage

	end
end
