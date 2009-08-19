module ActiveRecord
	class Base
		class << self # Needed because we are redefining a class method
      alias_method :attr_name, :human_attribute_name
    end
	end
end
