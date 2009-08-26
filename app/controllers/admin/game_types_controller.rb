class Admin::GameTypesController < Admin::AdminController
  def index
    
  end
  def show
    @game_type = GameTypes::Base.find params[:id]
  end

  def new
    @game_type = GameTypes::Base.new
    @blind_values = [BlindValue.new :level => 1]
		@winner_prizes = [WinnerPrize.new(:grade => 1, :prize_part => 1)]
  end

  def create
    @game_type = GameTypes::Base.factory params[:game_main_type], params[:game_types_base]
		params[:blind_value].delete_if {|level| level[:value].blank? }
		@game_type.blind_values.build params[:blind_value]
		@game_type.winner_prizes.build params[:winner_prize]
    if @game_type.save
      flash[:notice] = t 'controllers.game_types.new_type_successfully_created'
      redirect_to game_types_path
    else
			@game_type_with_errors = @game_type
			@game_type = GameTypes::Base.new params[:game_types_base]
			@blind_values = params[:blind_value].map{|options| BlindValue.new options}
			@winner_prizes = params[:winner_prize].map{|options| WinnerPrize.new options}
      flash[:error] = t 'controllers.game_types.cant_create_new_game_type'
      render :action => :new
    end
  end

  def edit
    @game_type = GameTypes::Base.find params[:id]
    @blind_values = @game_type.blind_values.all
    @winner_prizes = @game_type.winner_prizes.all
  end

  def update
    @game_type = GameTypes::Base.find params[:id]
    if @game_type.update_attributes(params[:game_type])
      flash[:notice] = t :successfully_updated
      redirect_to
    else
      flash[:error] = t 'controllers.game_types.failed_to_update_type'
      render :action => :edit
    end
  end
end
