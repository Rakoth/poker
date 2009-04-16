class GamesController < ApplicationController

  before_filter :check_authorization, :except => :index

  def index
    @games = Game.all :include => [:type]
  end

  def show
    @game = Game.find params[:id], :include => [:type]
		@game_in_json = @game.build_init_data(current_user.id).to_json
    render :layout => false
  end

  def new
    @game = Game.new
    @types = GameType.for_create
  end

  def create
    if @type = GameType.find_by_id(params[:game][:type]) and current_user.can_create?(@type)
      if @game = Game.create(:type => @type, :blind_size => @type.start_blind)
        if current_user.join!(@game)
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

	def synchronize
		respond_to do |format|
			format.json {
				game = Game.find params[:id]
				add_players = game.players.select{|p| !params[:players].to_a.include?(p.id.to_s)}
				remove_players = params[:players].select{|id| !game.players.map(&:id).include?(id.to_i)}
				players = {}
				players[:add] = add_players.map{|p| {:id => p.id, :login => p.login, :sit => p.sit}} unless add_players.empty?
				players[:remove] = remove_players unless remove_players.empty?
				if game.started?
					players[:game] = {
						:blind_position => game.blind_position,
						:small_blind_position => game.small_blind_position,
						:next_level_time => game.next_level_time,
						:active_player_id => game.active_player_id
					}
				end
				unless players.empty?
					render :json => players.to_json and return
				else
					render :nothing => true and return
				end
			}
		end
	end

end
