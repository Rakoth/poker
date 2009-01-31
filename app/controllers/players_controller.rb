class PlayersController < ApplicationController

  before_filter :check_authorization

  def create
    @game = Game.find params[:game_id]
    if @game and @current_user.can_join?(@game) and @game.add_player(@current_user)
      flash[:notice] = "Вы успешно присоединились к игре!"
      redirect_to game_url(@game)
    else
      flash[:error] = "Невозможно присоединиться к этой игре!"
      redirect_to games_url
    end
  end

  def destroy
    return unless request.delete?
    @player = Player.current(params[:game_id], @current_user.id).first
    if @player and @current_user.id == @player.user_id and @player.game.wait?
      @player.destroy
      flash[:notice] = "Вы успешно вышли из игры"
    else
      flash[:error] = "Невозможно покинуть эту игру"
    end
    redirect_to games_url
  end

end
