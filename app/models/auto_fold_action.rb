class AutoFoldAction < FoldAction
  def kind
    return 0
  end

	private
	
	def perform!
		player_influence
	end

end
