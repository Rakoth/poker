class AutoFoldAction < FoldAction
  def kind
    return 0
  end

	def has_value?
		false
	end

	private
	
	def perform!
		player_influence
	end

end
