class SyncBuilder::Player::Init < SyncBuilder::Base
	def data
		{
			:id => @object.id,
			:login => login,
			:sit => sit
		}
	end
end