class PlayersController < ApplicationController

  before_filter :check_authorization

  def create
    @game = Game.find params[:game_id]
    if @game and current_user.join!(@game)
			render :nothing => true #, :status => :no_content
    else
			render :nothing => true, :status => :bad_request
    end
  end

  def destroy
    return unless request.delete?
    @player = current_user.current_player params[:game_id]
    if @player and @player.game.waited?
      @player.destroy
      flash[:notice] = t 'controllers.players.successfully_leave_the_game'
    else
      flash[:error] = t 'controllers.players.cant_leave_the_game'
    end
    redirect_to games_url
  end

	def i_am_back
		player = current_user.players.find params[:id]
		if(player)
			if !player.away?
				status = :ok
			elsif player.back_to_game!
				player.game.resume! player
				status = :ok
			else
				status = :bad_request
			end
		else
			status = :forbidden
		end
		render :nothing => true, :status => status
	end

end
