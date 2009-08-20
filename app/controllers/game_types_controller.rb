class GameTypesController < ApplicationController
	def index
		@free_game_types = GameTypes::Free.all
		@paid_game_types = GameTypes::Paid.all
	end
end
