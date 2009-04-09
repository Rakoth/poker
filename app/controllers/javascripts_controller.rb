class JavascriptsController < ApplicationController
	def initialize_game
		respond_to do |format|
			format.js {}
		end
	end
end
