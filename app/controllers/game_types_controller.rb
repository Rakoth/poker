class GameTypesController < ApplicationController
	def index
		@game_types = GameTypes::Free.all
		@type = GameTypes::Base::FREE
	end

	def paid
		@game_types = GameTypes::Paid.all
		@type = GameTypes::Base::PAID
		render :action => :index
	end
end
