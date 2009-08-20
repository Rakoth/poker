class Admin::GameTypesController < Admin::AdminController
  def show
    @game_type = GameTypes::Base.find params[:id]
  end

  def new
    @game_type = GameTypes::Base.new
    @blind_value = BlindValue.new
  end

  def create
    @game_type = GameTypes::Base.factory params[:game_main_type], params[:game_types_base]
    if @game_type.save
      params[:blind_value].delete_if {|level| level[:value].blank? }
      @game_type.blind_values.create params[:blind_value]
      flash[:notice] = t 'controllers.game_types.new_type_successfully_created'
      redirect_to admin_game_types_path
    else
			@game_type = GameTypes::Base.new params[:game_types_base]
			@blind_value = BlindValue.new
      flash[:error] = t 'controllers.game_types.cant_create_new_game_type'
      render :action => :new
    end
  end

  def edit
    @game_type = GameTypes::Base.find params[:id]
    @blind_value = @game_type.blind_values.all
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
