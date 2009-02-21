class PlayersController < ApplicationController

  before_filter :check_authorization

  def create
    @game = Game.find params[:game_id]
    if @game and @game.add_player(@current_user)
      flash[:notice] = "Вы успешно присоединились к игре!"
      redirect_to game_url(@game)
    else
      flash[:error] = "Невозможно присоединиться к этой игре!"
      redirect_to games_url
    end
  end

  def destroy
    return unless request.delete?
    @player = @current_user.players.find_by_game_id params[:game_id]
    if @player and @player.game.wait?
      @player.destroy
      flash[:notice] = "Вы успешно вышли из игры!"
    else
      flash[:error] = "Невозможно покинуть эту игру"
    end
    redirect_to games_url
  end

end
