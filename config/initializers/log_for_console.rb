if "irb" == $0
	ActiveRecord::Base.logger = Logger.new(STDOUT)
end