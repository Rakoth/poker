class JavascriptsController < ApplicationController
	def initialize_game
		respond_to do |format|
			format.js {}
		end
	end

	def test_response_status
		render :nothing => true, :status => params[:status]
	end
end
