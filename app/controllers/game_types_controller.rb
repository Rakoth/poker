class GameTypesController < ApplicationController
	def index
		@game_types = GameTypes::Free.all
	end

	def paid
		@game_types = GameTypes::Paid.all
		render :action => :index
	end
end
